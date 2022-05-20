import { helper } from "@ember/component/helper";

interface Address {
  addr1: string;
  addr2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export function encode([address]: [Address]): string {
  const query = encodeURI(
    `${address.addr1}${address.addr2 ? " " + address.addr2 : ""}, ${
      address.city
    }, ${address.state} ${address.zip} ${
      address.country ? address.country : ""
    }`
  );
  return `https://www.google.com/maps/dir/?api=1&dir_action=navigate&destination=${query}`;
}

export default helper(encode);
