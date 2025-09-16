/*
 * Mock for GnomeDesktop from gi://GnomeDesktop
 */

export class WallClock {
  public clock: string = '';

  constructor() {
    this.clock = new Date().toISOString();
  }

  bind_property = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
}

export default {
  WallClock,
};