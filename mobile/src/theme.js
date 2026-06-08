export const colors = {
  primary: '#0056B3',
  primaryDark: '#00478D',
  bg: '#F7F9FB',
  card: '#FFFFFF',
  text: '#0F172B',
  muted: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E2E8F0',
  dark: '#0F172B',
};

export const statusBadge = (status) => {
  if (status === 'ALTO') return { bg: '#FEE2E2', fg: colors.danger };
  if (status === 'MÉDIO') return { bg: '#FEF3C7', fg: colors.warning };
  return { bg: '#D1FAE5', fg: colors.success };
};
