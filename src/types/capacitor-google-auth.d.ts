declare module '@codetrix-studio/capacitor-google-auth' {
  export interface User {
    id: string;
    email: string;
    name: string;
    familyName: string;
    givenName: string;
    imageUrl: string;
    serverAuthCode: string;
    authentication: Authentication;
  }

  export interface Authentication {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
  }

  export interface GoogleAuthPluginOptions {
    clientId?: string;
    iosClientId?: string;
    androidClientId?: string;
    scopes?: string[];
    serverClientId?: string;
    forceCodeForRefreshToken?: boolean;
  }

  export interface InitOptions {
    clientId?: string;
    scopes?: string[];
    grantOfflineAccess?: boolean;
  }

  export interface GoogleAuthPlugin {
    initialize(options?: InitOptions): Promise<void>;
    signIn(): Promise<User>;
    refresh(): Promise<Authentication>;
    signOut(): Promise<any>;
  }

  export const GoogleAuth: GoogleAuthPlugin;
}
