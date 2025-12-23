export enum ROLE {
    admin = 'admin',
    user = 'user',
    guest = 'guest',
    manager = 'manager'
};

export enum Permission {
    READ_ORDER = "read:order",
    WRITE_ORDER = "write:order",
    UPDATE_ORDER = "update:order",
    DELETE_ORDER = "delete:order",

    READ_USER = "read:user",
    WRITE_USER = "write:user",
    UPDATE_USER = "update:user", 
    DELETE_USER = "delete:user",

    AUTH_LOGIN = "auth:login",
    AUTH_LOGOUT = "auth:logout"
};

type RolePermission = {
    [key in ROLE] : Permission[]
}

export const rolePermission = {
    [ROLE.admin]: [ ...Object.values(Permission) ],
    [ROLE.user]: [
        Permission.WRITE_ORDER, // Users can create orders
        Permission.UPDATE_ORDER,
        Permission.READ_USER,    // Users can view user info (maybe their own?)
        Permission.UPDATE_USER,
        Permission.DELETE_USER
    ],
    [ROLE.guest]: [
        Permission.WRITE_USER, // Guests can create a user account (sign up)
        Permission.READ_ORDER, // Guests can view orders (maybe public ones?)
        Permission.AUTH_LOGIN  // Guests can log in
    ],
    [ROLE.manager]: [
        Permission.READ_ORDER,   // Managers can view orders
        Permission.WRITE_ORDER,  // Managers can create orders
        Permission.UPDATE_ORDER, // Managers can update orders
        Permission.DELETE_ORDER, // Managers can delete orders
        Permission.READ_USER,    // Managers can view user info
    ]
}

export const toRole = (role: string): ROLE => {
    switch (role) {
        case ROLE.admin:
            return ROLE.admin;
        case ROLE.user:
            return ROLE.user;
        case ROLE.guest:
            return ROLE.guest;
        case ROLE.manager:
            return ROLE.manager;
        default: 
            throw new Error(`Invalid role: ${role}`);
    }
}