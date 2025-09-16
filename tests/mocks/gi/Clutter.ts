/*
 * Mock for Clutter from gi://Clutter
 */

export const ActorAlign = {
  FILL: 'fill',
  START: 'start',
  CENTER: 'center',
  END: 'end',
};

export class Actor {
  constructor(props?: any) {
    if (props) {
      Object.assign(this, props);
    }
  }

  destroy = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
}

export default {
  Actor,
  ActorAlign,
};