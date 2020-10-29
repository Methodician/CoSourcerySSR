export interface KeyMapI<T> {
  [key: string]: T;
}

export interface HtmlInputEventI extends Event {
  target: HTMLInputElement & EventTarget;
}
