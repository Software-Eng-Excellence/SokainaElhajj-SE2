import { ROLE } from "../config/roles";
import { ID } from "../repository/IRepository";

export class User implements ID{
    name: string;
    email: string;
    password: string;
    id: string;
    role: string;

    constructor(name: string, email: string, password: string, id: string = '', role: ROLE = ROLE.user) {
        this.id = id;        
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    getId(): string {
        return this.id;
    }
}