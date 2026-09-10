/**
 * Global do script ben thu ba gan vao window.
 *
 * Ca hai SDK duoc nap bang the <script> trong index.html chu khong phai qua
 * npm, nen TypeScript khong biet chung ton tai. Khai bao o day thay vi rai
 * `(window as any)` khap noi - lam vay thi mat luon kiem tra kieu o nhung
 * cho that su dung SDK.
 *
 * Kieu de o muc toi thieu: chi nhung ham ma code nay goi. Muon day du thi
 * cai @types/facebook-js-sdk va @types/google.accounts.
 */

interface FacebookLoginResponse {
  status: string;
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
  };
}

interface FacebookSdk {
  init(options: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope: string },
  ): void;
  logout(callback?: () => void): void;
  getLoginStatus(callback: (response: FacebookLoginResponse) => void): void;
  api(
    path: string,
    params: Record<string, unknown>,
    callback: (response: Record<string, unknown>) => void,
  ): void;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(momentListener?: (notification: unknown) => void): void;
  disableAutoSelect(): void;
}

interface Window {
  /** Facebook SDK goi ham nay khi nap xong. */
  fbAsyncInit?: () => void;
  FB?: FacebookSdk;
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}

/**
 * Web Speech API. Chua co trong lib.dom mac dinh cua TypeScript vi spec
 * con o dang draft; Chrome/Edge dung tien to `webkit`.
 */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}
