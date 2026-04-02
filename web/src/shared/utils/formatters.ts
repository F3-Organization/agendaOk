/**
 * Formata um valor numérico para o padrão de moeda BRL (R$)
 * @param amount Valor em centavos
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
};

/**
 * Formata uma string de data para o padrão DD/MM/AAAA
 * @param dateString ISO string ou Date objeto
 */
export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};
