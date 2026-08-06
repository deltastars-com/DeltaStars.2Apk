import { isBiometricAvailable, registerBiometric, authenticateBiometric, hasRegisteredKey } from '../components/webAuthn';

export const webAuthn = {
  /**
   * Checks if the device supports biometric authentication.
   */
  isSupported: async (): Promise<boolean> => {
    return isBiometricAvailable();
  },

  /**
   * Registers a new biometric credential for the user.
   */
  register: async (userId: string, userName: string): Promise<string> => {
    console.log(`Registering biometrics for user: ${userName} (${userId})`);
    const success = await registerBiometric(userId);
    return success ? `biometric_key_${userId}_${Date.now()}` : '';
  },

  /**
   * Authenticates the user using biometrics.
   */
  authenticate: async (userId: string): Promise<boolean> => {
    console.log(`Authenticating biometrics for user ID: ${userId}`);
    return authenticateBiometric(userId);
  },

  hasRegisteredKey: (userId: string): boolean => {
    return hasRegisteredKey(userId);
  }
};

