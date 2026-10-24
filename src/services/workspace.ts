import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory cache for the OAuth access token (per workspace skill: NEVER in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export async function signInWithGoogleWorkspace(): Promise<{ user: User; accessToken: string }> {
  if (isSigningIn) {
    throw new Error('Sign-in already in progress');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace OAuth access token.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getCachedWorkspaceToken(): string | null {
  return cachedAccessToken;
}

export function clearWorkspaceToken(): void {
  cachedAccessToken = null;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

// List Drive Files
export async function listDriveFiles(token?: string): Promise<DriveFileItem[]> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Google Workspace access token required. Please authenticate.');
  }

  const queryParams = new URLSearchParams({
    pageSize: '25',
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size)',
    orderBy: 'modifiedTime desc',
    q: "trashed = false",
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.files || []) as DriveFileItem[];
}

// Create a new Google Document with sovereign telemetry report
export async function createSovereignAuditDoc(
  title: string,
  content: string,
  token?: string
): Promise<{ documentId: string; title: string; documentUrl: string }> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Google Workspace access token required. Please authenticate.');
  }

  // 1. Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Docs creation error (${createRes.status}): ${errText}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // 2. Insert formatted audit content
  if (content && content.length > 0) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      console.warn('BatchUpdate text insertion warning:', await updateRes.text());
    }
  }

  return {
    documentId,
    title,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

// Backup Ledger directly to Google Drive as a JSON file
export async function uploadLedgerToDrive(
  fileName: string,
  jsonData: unknown,
  token?: string
): Promise<{ fileId: string; webViewLink?: string }> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Google Workspace access token required. Please authenticate.');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Sovereign Octa-Lobe Tactical Command Cryptographic Audit Ledger Backup',
  };

  const fileContent = JSON.stringify(jsonData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive upload error (${res.status}): ${errText}`);
  }

  const fileData = await res.json();
  return {
    fileId: fileData.id,
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
  };
}
