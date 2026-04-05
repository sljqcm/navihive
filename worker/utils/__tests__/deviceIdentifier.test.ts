import { describe, it, expect } from 'vitest';
import {
  getDeviceIdentifier,
  generateDeviceIdentifier,
  isValidDeviceIdentifier,
} from '../deviceIdentifier';

describe('deviceIdentifier', () => {
  describe('generateDeviceIdentifier', () => {
    it('should generate a device identifier with guest_ prefix', () => {
      const id = generateDeviceIdentifier();
      expect(id).toMatch(/^guest_/);
    });

    it('should generate a valid UUID format', () => {
      const id = generateDeviceIdentifier();
      expect(isValidDeviceIdentifier(id)).toBe(true);
    });

    it('should generate unique identifiers', () => {
      const id1 = generateDeviceIdentifier();
      const id2 = generateDeviceIdentifier();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidDeviceIdentifier', () => {
    it('should validate correct device identifier format', () => {
      const validId = 'guest_550e8400-e29b-41d4-a716-446655440000';
      expect(isValidDeviceIdentifier(validId)).toBe(true);
    });

    it('should accept uppercase UUID', () => {
      const validId = 'guest_550E8400-E29B-41D4-A716-446655440000';
      expect(isValidDeviceIdentifier(validId)).toBe(true);
    });

    it('should reject identifier without guest_ prefix', () => {
      const invalidId = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidDeviceIdentifier(invalidId)).toBe(false);
    });

    it('should reject malformed UUID', () => {
      const invalidId = 'guest_invalid-uuid-format';
      expect(isValidDeviceIdentifier(invalidId)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidDeviceIdentifier('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isValidDeviceIdentifier(null as any)).toBe(false);
      expect(isValidDeviceIdentifier(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidDeviceIdentifier(123 as any)).toBe(false);
      expect(isValidDeviceIdentifier({} as any)).toBe(false);
    });
  });

  describe('getDeviceIdentifier', () => {
    it('should get device identifier from X-Device-ID header', () => {
      const deviceId = 'guest_550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://example.com', {
        headers: {
          'X-Device-ID': deviceId,
        },
      });

      expect(getDeviceIdentifier(request)).toBe(deviceId);
    });

    it('should get device identifier from Cookie header', () => {
      const deviceId = 'guest_550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://example.com', {
        headers: {
          Cookie: `device_id=${deviceId}; other_cookie=value`,
        },
      });

      expect(getDeviceIdentifier(request)).toBe(deviceId);
    });

    it('should prioritize X-Device-ID header over Cookie', () => {
      const headerDeviceId = 'guest_550e8400-e29b-41d4-a716-446655440000';
      const cookieDeviceId = 'guest_660e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://example.com', {
        headers: {
          'X-Device-ID': headerDeviceId,
          Cookie: `device_id=${cookieDeviceId}`,
        },
      });

      expect(getDeviceIdentifier(request)).toBe(headerDeviceId);
    });

    it('should return null when no device identifier is present', () => {
      const request = new Request('https://example.com');
      expect(getDeviceIdentifier(request)).toBeNull();
    });

    it('should return null when Cookie header exists but no device_id', () => {
      const request = new Request('https://example.com', {
        headers: {
          Cookie: 'other_cookie=value; another=test',
        },
      });

      expect(getDeviceIdentifier(request)).toBeNull();
    });

    it('should handle Cookie with spaces correctly', () => {
      const deviceId = 'guest_550e8400-e29b-41d4-a716-446655440000';
      const request = new Request('https://example.com', {
        headers: {
          Cookie: ` device_id = ${deviceId} ; other=value `,
        },
      });

      expect(getDeviceIdentifier(request)).toBe(deviceId);
    });
  });
});
