describe('Math operations', () => {
  it('should add two numbers correctly', () => {
    const add = (a, b) => a + b;
    expect(add(2, 3)).toBe(5);
  });

  it('should subtract two numbers correctly', () => {
    const subtract = (a, b) => a - b;
    expect(subtract(5, 3)).toBe(2);
  });

  it('should handle negative numbers', () => {
    const add = (a, b) => a + b;
    expect(add(-5, 3)).toBe(-2);
  });
});

describe('String operations', () => {
  it('should capitalize first letter', () => {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should handle empty string', () => {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    expect(capitalize('')).toBe('');
  });
});
