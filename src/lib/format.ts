export const timeGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Pagi'
  if (hour < 15) return 'Siang'
  if (hour < 18) return 'Sore'
  return 'Malam'
}

export const initials = (name: string) => name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
