export function getRoomPasscode(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('room_passcode');
}

export function setRoomPasscode(code: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('room_passcode', code);
}

export function clearRoomPasscode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('room_passcode');
}
