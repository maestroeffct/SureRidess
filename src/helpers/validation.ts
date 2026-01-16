const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length < 6) return 'weak';

  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasNumber && hasLetter && hasSymbol && password.length >= 8) {
    return 'strong';
  }

  return 'medium';
};

const getStrengthColor = (strength: PasswordStrength, colors: any) => {
  switch (strength) {
    case 'strong':
      return '#22C55E'; // green
    case 'medium':
      return '#FACC15'; // yellow
    default:
      return '#EF4444'; // red
  }
};

export { isValidEmail, getPasswordStrength, getStrengthColor };
