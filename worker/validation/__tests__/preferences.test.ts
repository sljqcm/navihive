/**
 * 偏好设置验证工具单元测试
 */

import { describe, it, expect } from 'vitest';
import { validateFavoriteRequest, validatePreferencesUpdate } from '../preferences';

describe('validateFavoriteRequest', () => {
  describe('有效输入', () => {
    it('应该接受有效的正整数', () => {
      const result = validateFavoriteRequest(42);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.sanitizedData).toBe(42);
    });

    it('应该接受数字字符串并转换为数字', () => {
      const result = validateFavoriteRequest('123');
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.sanitizedData).toBe(123);
    });

    it('应该接受字符串形式的正整数', () => {
      const result = validateFavoriteRequest('1');
      expect(result.valid).toBe(true);
      expect(result.sanitizedData).toBe(1);
    });
  });

  describe('无效输入', () => {
    it('应该拒绝 undefined', () => {
      const result = validateFavoriteRequest(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID不能为空');
    });

    it('应该拒绝 null', () => {
      const result = validateFavoriteRequest(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID不能为空');
    });

    it('应该拒绝零', () => {
      const result = validateFavoriteRequest(0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是正整数');
    });

    it('应该拒绝负数', () => {
      const result = validateFavoriteRequest(-5);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是正整数');
    });

    it('应该拒绝小数', () => {
      const result = validateFavoriteRequest(3.14);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是整数');
    });

    it('应该拒绝无效的字符串', () => {
      const result = validateFavoriteRequest('abc');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是有效的数字');
    });

    it('应该拒绝布尔值', () => {
      const result = validateFavoriteRequest(true);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是数字');
    });

    it('应该拒绝对象', () => {
      const result = validateFavoriteRequest({ id: 42 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是数字');
    });

    it('应该拒绝数组', () => {
      const result = validateFavoriteRequest([42]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('站点ID必须是数字');
    });
  });
});

describe('validatePreferencesUpdate', () => {
  describe('有效输入', () => {
    it('应该接受有效的 view_mode', () => {
      const result = validatePreferencesUpdate({ view_mode: 'card' });
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.sanitizedData?.view_mode).toBe('card');
    });

    it('应该接受有效的 theme_mode', () => {
      const result = validatePreferencesUpdate({ theme_mode: 'dark' });
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.theme_mode).toBe('dark');
    });

    it('应该接受 null 作为 custom_colors', () => {
      const result = validatePreferencesUpdate({ custom_colors: null });
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.custom_colors).toBeNull();
    });

    it('应该接受有效的 JSON 字符串作为 custom_colors', () => {
      const colors = JSON.stringify({ primary: '#5eead4', background: '#07131d' });
      const result = validatePreferencesUpdate({ custom_colors: colors });
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.custom_colors).toBe(colors);
    });

    it('应该接受对象作为 custom_colors 并转换为 JSON', () => {
      const colors = { primary: '#5eead4', secondary: '#fb923c' };
      const result = validatePreferencesUpdate({ custom_colors: colors });
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.custom_colors).toBe(JSON.stringify(colors));
    });

    it('应该接受多个有效字段', () => {
      const result = validatePreferencesUpdate({
        view_mode: 'list',
        theme_mode: 'light',
        custom_colors: null,
      });
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.view_mode).toBe('list');
      expect(result.sanitizedData?.theme_mode).toBe('light');
      expect(result.sanitizedData?.custom_colors).toBeNull();
    });

    it('应该接受包含所有有效颜色字段的对象', () => {
      const colors = {
        primary: '#5eead4',
        secondary: '#fb923c',
        background: '#07131d',
        surface: 'rgba(10, 23, 33, 0.82)',
        text: '#f4fbfa',
      };
      const result = validatePreferencesUpdate({ custom_colors: colors });
      expect(result.valid).toBe(true);
    });
  });

  describe('无效输入', () => {
    it('应该拒绝非对象输入', () => {
      const result = validatePreferencesUpdate('invalid');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('偏好设置数据必须是对象');
    });

    it('应该拒绝 null', () => {
      const result = validatePreferencesUpdate(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('偏好设置数据必须是对象');
    });

    it('应该拒绝数组', () => {
      const result = validatePreferencesUpdate([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('偏好设置数据必须是对象');
    });

    it('应该拒绝空对象', () => {
      const result = validatePreferencesUpdate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('至少需要提供一个偏好设置字段进行更新');
    });

    it('应该拒绝无效的 view_mode', () => {
      const result = validatePreferencesUpdate({ view_mode: 'grid' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("视图模式必须是 'card' 或 'list'");
    });

    it('应该拒绝非字符串的 view_mode', () => {
      const result = validatePreferencesUpdate({ view_mode: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('视图模式必须是字符串');
    });

    it('应该拒绝无效的 theme_mode', () => {
      const result = validatePreferencesUpdate({ theme_mode: 'blue' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("主题模式必须是 'light' 或 'dark'");
    });

    it('应该拒绝非字符串的 theme_mode', () => {
      const result = validatePreferencesUpdate({ theme_mode: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('主题模式必须是字符串');
    });

    it('应该拒绝无效的 JSON 字符串作为 custom_colors', () => {
      const result = validatePreferencesUpdate({ custom_colors: '{invalid json}' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('自定义颜色必须是有效的 JSON 格式');
    });

    it('应该拒绝 JSON 数组作为 custom_colors', () => {
      const result = validatePreferencesUpdate({ custom_colors: '["color1", "color2"]' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('自定义颜色必须是有效的 JSON 对象');
    });

    it('应该拒绝包含无效字段的 custom_colors 对象', () => {
      const colors = { primary: '#5eead4', invalid_field: '#000000' };
      const result = validatePreferencesUpdate({ custom_colors: colors });
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('自定义颜色包含无效的字段');
    });

    it('应该拒绝包含非字符串值的 custom_colors 对象', () => {
      const colors = { primary: 123 };
      const result = validatePreferencesUpdate({ custom_colors: colors });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('自定义颜色的所有值必须是字符串');
    });

    it('应该拒绝数字作为 custom_colors', () => {
      const result = validatePreferencesUpdate({ custom_colors: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('自定义颜色必须是 JSON 字符串、对象或 null');
    });

    it('应该拒绝布尔值作为 custom_colors', () => {
      const result = validatePreferencesUpdate({ custom_colors: true });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('自定义颜色必须是 JSON 字符串、对象或 null');
    });
  });

  describe('边界情况', () => {
    it('应该处理包含有效和无效字段的混合输入', () => {
      const result = validatePreferencesUpdate({
        view_mode: 'card',
        theme_mode: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("主题模式必须是 'light' 或 'dark'");
    });

    it('应该忽略未知字段', () => {
      const result = validatePreferencesUpdate({
        view_mode: 'card',
        unknown_field: 'value',
      });
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.view_mode).toBe('card');
      expect((result.sanitizedData as Record<string, unknown>).unknown_field).toBeUndefined();
    });
  });
});
