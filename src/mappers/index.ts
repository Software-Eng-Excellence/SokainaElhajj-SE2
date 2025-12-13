// import { ItemCategory } from "model/IItem";
// import { JsonRequestOrderMapper } from "./Order.mapper";
// import { JsonCakeRequestMapper } from "./Cake.mapper";
// import { JsonRequestBookMapper } from "./Book.mapper";
// import { JsonRequestToyMapper } from "./Toy.mapper";

// export class JsonRequestFactory {
//     public static create(type: ItemCategory): JsonRequestOrderMapper {
//         switch (type) {
//             case ItemCategory.CAKE:
//                 return new JsonRequestOrderMapper(new JsonCakeRequestMapper());
//             case ItemCategory.Book:
//                 return new JsonRequestOrderMapper(new JsonRequestBookMapper());
//             case ItemCategory.Toy:
//                 return new JsonRequestOrderMapper(new JsonRequestToyMapper());
//             default: 
//                 throw new Error("Unsupported type");
//         }
//     }
// }