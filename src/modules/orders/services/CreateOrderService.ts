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

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsFound = await this.productsRepository.findAllById(products);

    const productsOrder = products.map(product => {
      const productFind = productsFound.find(p => p.id === product.id);
      if (!productFind) {
        throw new AppError(`Product ${product.id} not found`);
      }

      if (product.quantity > productFind.quantity) {
        throw new AppError('Quantity greater than stock');
      }

      return {
        product_id: product.id,
        quantity: product.quantity,
        price: productFind.price,
        stock: productFind.quantity - product.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsOrder,
    });

    await this.productsRepository.updateQuantity(
      productsOrder.map(product => ({
        id: product.product_id,
        quantity: product.stock,
      })),
    );

    return order;
  }
}

export default CreateOrderService;
