export type PermissiveDict<V> = {
  [key: string | number | symbol]: V | undefined;
};
export type Dict<V> = { [key: string]: V | undefined };
