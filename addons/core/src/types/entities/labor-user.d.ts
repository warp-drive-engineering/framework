import type { LaborEmployee } from "./labor-employee";
import type { LaborStoreLocation } from "./labor-store-location";

export type LaborUser = Readonly<{
  id: string;

  employeeRecords: ReadonlyArray<LaborEmployee>;
  storeLocations: ReadonlyArray<LaborStoreLocation>;
}>;

// session
//  user-id
//
// local-storage?
//  employee-id
//  store-id

/*

  GET /api/v2/auth/user

  // tied to the session, get user-id from the session

  {
    data: {
      type: "labor-user",
      id: "<whatever-from-session>",
      relationships: {
        employeeRecords: {
          data: [
            { type: "labor-employee", id: "1" }
          ]
        },
        storeLocations: {
          data: [
            { type: "labor-store-location", id: "1" }
          ]
        }
      }
    }
    included: [
      {
        type: "labor-employee",
        id: "1",
        attributes: {

        },
        relationships: {
          user: {
            data: { type: "labor-user", id: "<whatever-from-session>" }
          },
          availabilityList: {
            data: [
              { type: "employee-availability", id: "1" }
            ]
          }
        }
      },
      {
        type: "employee-availability",
        id: "1",
        attributes: {},
        relationships: {}
      }
    ]
  }

  {
    data: [
      {
        type: "schedule-shift",
        id: "1",
        attributes: {},
        relationsips: {},
      },
      {
        type: "schedule-shift",
        id: "2",
        attributes: {},
        relationsips: {},
      }
    ],
    included: []
  },

*/
