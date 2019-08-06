export interface IKeyMap<T> {
  [key: string]: T;
}

export interface IHtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}
