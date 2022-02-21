import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {User} from "./users.model";
import {InjectModel} from "@nestjs/sequelize";
import {CreateUserDto} from "./dto/create-user.dto";
import {RolesService} from "../roles/roles.service";
import {AddRoleDto} from "./dto/add-role.dto";
import {BanUserDto} from "./dto/ban-user.dto";
import { UserRoles } from "../roles/user-roles.model";

import { Role } from "../roles/roles.model";

@Injectable() 
export class UsersService {
    
    // внедряем модель используя конструктор
    constructor(@InjectModel(User) private userRepository: typeof User,
    private roleService: RolesService) {}

    async createUser(dto: CreateUserDto) {
        const user = await this.userRepository.create(dto);
        const role = await this.roleService.getRoleByValue("ADMIN")
        // await user.$set('roles', [role.id])
        // user.roles = [role]
        // console.log(user)
        return user; 
    }

    async getAllUsers() {
        const users = await this.userRepository.findAll({
            include: {
                model: Role,
                attributes: ['value'],  
                through:{
                    attributes: []
                }  
            },            
        });

        // const roles = users.map(user => {
        //     return user.roles;
        // })
        // .reduce((previus, next) => previus.concat(next), [])
        // .map(role => {
        //     return role.value;
        // });
        users.forEach(user =>{
            user.setDataValue('roles', user.roles.map(role => {
                return (user)
            }));
        });

        // const rolesAsObject = users.map(user => {
        //     return user.roles;
        // }).reduce((previus, next) => previus.concat(next), [])
        // .map(role => {
        //     return role.value
        // });
        console.log(users.map(user => user.roles))
        return users;
    }

    async getUserByEmail(email: string) {
        const user = await this.userRepository.findOne({where: {email}, include: {all: true}})
        return user;
    }

    async addRole(dto: AddRoleDto) {
        const user = await this.userRepository.findByPk(dto.userId);
        const role = await this.roleService.getRoleByValue(dto.value);
        if (role && user) {
            await user.$add('role', role.id);
            return dto;
        }
        throw new HttpException('Пользователь или роль не найдены', HttpStatus.NOT_FOUND);
    }

    async ban(dto: BanUserDto) {
        const user = await this.userRepository.findByPk(dto.userId);
        if (!user) {
            throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
        }
        user.banned = true;
        user.banReason = dto.banReason;
        await user.save();
        return user;
    }
}


