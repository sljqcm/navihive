/**
 * Tests for User Identifier Resolution Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserIdentifier } from '../userIdentifier';
import { NavigationAPI } from '../../../src/API/http';
import * as deviceIdentifierModule from '../deviceIdentifier';

// Mock the deviceIdentifier module
vi.mock('../deviceIdentifier', () => ({
  getDeviceIdentifier: vi.fn(),
  generateDeviceIdentifier: vi.fn(),
}));

describe('getUserIdentifier', () => {
  let mockApi: NavigationAPI;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock NavigationAPI instance
    mockApi = {
      verifyToken: vi.fn(),
    } as unknown as NavigationAPI;
  });

  describe('Authenticated User Flow', () => {
    it('should return authenticated user from auth_token cookie', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'auth_token=valid-token-123',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: true,
        payload: { username: 'admin' },
      });

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'admin',
        isGuest: false,
      });
      expect(mockApi.verifyToken).toHaveBeenCalledWith('valid-token-123');
    });

    it('should return authenticated user from Authorization Bearer header', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Authorization: 'Bearer valid-token-456',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: true,
        payload: { username: 'testuser' },
      });

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'testuser',
        isGuest: false,
      });
      expect(mockApi.verifyToken).toHaveBeenCalledWith('valid-token-456');
    });

    it('should prioritize cookie over Authorization header', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'auth_token=cookie-token',
          Authorization: 'Bearer header-token',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: true,
        payload: { username: 'admin' },
      });

      await getUserIdentifier(request, mockApi);

      expect(mockApi.verifyToken).toHaveBeenCalledWith('cookie-token');
    });
  });

  describe('Guest User Flow', () => {
    it('should return existing device identifier for guest user', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Device-ID': 'guest_abc123def456',
        },
      });

      vi.mocked(deviceIdentifierModule.getDeviceIdentifier).mockReturnValue('guest_abc123def456');

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'guest_abc123def456',
        isGuest: true,
      });
      expect(deviceIdentifierModule.getDeviceIdentifier).toHaveBeenCalledWith(request);
    });

    it('should generate new device identifier if none exists', async () => {
      const request = new Request('https://example.com');

      vi.mocked(deviceIdentifierModule.getDeviceIdentifier).mockReturnValue(null);
      vi.mocked(deviceIdentifierModule.generateDeviceIdentifier).mockReturnValue(
        'guest_new123xyz789'
      );

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'guest_new123xyz789',
        isGuest: true,
      });
      expect(deviceIdentifierModule.getDeviceIdentifier).toHaveBeenCalledWith(request);
      expect(deviceIdentifierModule.generateDeviceIdentifier).toHaveBeenCalled();
    });
  });

  describe('Token Verification Failures', () => {
    it('should fall back to device identifier when token is invalid', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'auth_token=invalid-token',
          'X-Device-ID': 'guest_fallback123',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: false,
      });
      vi.mocked(deviceIdentifierModule.getDeviceIdentifier).mockReturnValue('guest_fallback123');

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'guest_fallback123',
        isGuest: true,
      });
    });

    it('should fall back to device identifier when token verification throws error', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'auth_token=malformed-token',
        },
      });

      vi.mocked(mockApi.verifyToken).mockRejectedValue(new Error('Token parse error'));
      vi.mocked(deviceIdentifierModule.getDeviceIdentifier).mockReturnValue(null);
      vi.mocked(deviceIdentifierModule.generateDeviceIdentifier).mockReturnValue('guest_error123');

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'guest_error123',
        isGuest: true,
      });
    });

    it('should fall back to device identifier when payload has no username', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'auth_token=token-without-username',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: true,
        payload: { exp: 1234567890 }, // No username field
      });
      vi.mocked(deviceIdentifierModule.getDeviceIdentifier).mockReturnValue(null);
      vi.mocked(deviceIdentifierModule.generateDeviceIdentifier).mockReturnValue('guest_nouser123');

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'guest_nouser123',
        isGuest: true,
      });
    });
  });

  describe('Cookie Parsing', () => {
    it('should handle multiple cookies correctly', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'session=xyz; auth_token=my-token; theme=dark',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: true,
        payload: { username: 'cookieuser' },
      });

      const result = await getUserIdentifier(request, mockApi);

      expect(result).toEqual({
        userId: 'cookieuser',
        isGuest: false,
      });
      expect(mockApi.verifyToken).toHaveBeenCalledWith('my-token');
    });

    it('should handle cookies with = in value', async () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'auth_token=token=with=equals',
        },
      });

      vi.mocked(mockApi.verifyToken).mockResolvedValue({
        valid: true,
        payload: { username: 'equaluser' },
      });

      await getUserIdentifier(request, mockApi);

      expect(mockApi.verifyToken).toHaveBeenCalledWith('token=with=equals');
    });
  });
});
