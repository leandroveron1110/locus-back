export type MenuProductWithOptions = {
  id: string;
  name: string;
  optionGroups: {
    id: string;
    name: string;
    options: {
      id: string;
      name: string;
      priceModifierType: string;
    }[];
  }[];
};
