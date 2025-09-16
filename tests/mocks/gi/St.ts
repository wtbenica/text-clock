/*
 * Mock for St from gi://St
 */

export const ActorAlign = {
  FILL: 'fill',
  START: 'start',
  CENTER: 'center',
  END: 'end',
};

export class Label {
  public text: string = '';
  public clutterText: any = {
    yAlign: null,
  };

  constructor(props?: any) {
    if (props) {
      Object.assign(this, props);
    }
  }

  set_text(text: string): void {
    this.text = text;
  }

  get_text(): string {
    return this.text;
  }

  destroy = jest.fn();
  add_style_class_name = jest.fn();
  remove_style_class_name = jest.fn();
  has_style_class_name = jest.fn().mockReturnValue(false);
  set_width = jest.fn();
}

export class BoxLayout {
  private _children: any[] = [];
  public style_class: string = '';

  constructor(props?: any) {
    if (props) {
      Object.assign(this, props);
      if (props.style_class) {
        this.style_class = props.style_class;
      }
    }
  }

  add_child(child: any): void {
    this._children.push(child);
  }

  insert_child_at_index(child: any, index: number): void {
    this._children.splice(index, 0, child);
  }

  get_children(): any[] {
    return this._children;
  }

  destroy = jest.fn();
  has_style_class_name = jest.fn((className: string) => this.style_class === className);
}

export default {
  Label,
  BoxLayout,
  ActorAlign,
};