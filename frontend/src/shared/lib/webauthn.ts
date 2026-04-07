const b64ToArray = (b64url: string) => {
  const padding = "=".repeat((4 - (b64url.length % 4)) % 4);
  const base64 = (b64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
};

const arrayToB64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

type PublicKeyOpts = Record<string, unknown>;
type CredWithId = { id?: string | ArrayBuffer | Uint8Array };

const toBufferId = (id: unknown): ArrayBuffer | undefined => {
  if (typeof id === "string") return b64ToArray(id);
  if (id instanceof Uint8Array) return id.buffer;
  if (id instanceof ArrayBuffer) return id;
  return undefined;
};

export const formatPublicKeyOptions = (opts: PublicKeyOpts) => {
  const copy: PublicKeyOpts = { ...opts };
  if (typeof opts.challenge === "string") {
    copy.challenge = b64ToArray(opts.challenge);
  }
  const user = (opts as { user?: CredWithId }).user;
  if (user?.id) {
    copy.user = { ...user, id: toBufferId(user.id) };
  }
  const excludeCredentials = (opts as { excludeCredentials?: CredWithId[] }).excludeCredentials;
  if (excludeCredentials) {
    copy.excludeCredentials = excludeCredentials.map((cred) => ({
      ...cred,
      id: toBufferId(cred.id),
    }));
  }
  const allowCredentials = (opts as { allowCredentials?: CredWithId[] }).allowCredentials;
  if (allowCredentials) {
    copy.allowCredentials = allowCredentials.map((cred) => ({
      ...cred,
      id: toBufferId(cred.id),
    }));
  }
  return copy;
};

export const serializeAttestation = (cred: PublicKeyCredential) => {
  const resp = cred.response as AuthenticatorAttestationResponse;
  return {
    id: cred.id,
    rawId: arrayToB64(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: arrayToB64(resp.clientDataJSON),
      attestationObject: arrayToB64(resp.attestationObject),
    },
    clientExtensionResults: cred.getClientExtensionResults?.() || {},
  };
};

export const serializeAssertion = (cred: PublicKeyCredential) => {
  const resp = cred.response as AuthenticatorAssertionResponse;
  return {
    id: cred.id,
    rawId: arrayToB64(cred.rawId),
    type: cred.type,
    response: {
      clientDataJSON: arrayToB64(resp.clientDataJSON),
      authenticatorData: arrayToB64(resp.authenticatorData),
      signature: arrayToB64(resp.signature),
      userHandle: resp.userHandle ? arrayToB64(resp.userHandle) : null,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() || {},
  };
};
