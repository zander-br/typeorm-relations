import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private readonly ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private readonly productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private readonly customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    const productsFound = await this.productsRepository.findAllById(products);

    const productsOrder = productsFound.map(({ id, price }) => {
      const quantity = products.find(p => p.id === id)?.quantity || 0;
      return {
        product_id: id,
        quantity,
        price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsOrder,
    });

    return order;
  }
}

export default CreateOrderService;
