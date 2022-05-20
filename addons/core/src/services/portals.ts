import Service from "@ember/service";

export default class extends Service {
  elements: Record<string, HTMLElement> = {};

  constructor(...args: object[]) {
    super(...args);

    const element = document.createElement("div");
    element.classList.add("page-header__content");
    this.elements.pageHeader = element;
  }
}
