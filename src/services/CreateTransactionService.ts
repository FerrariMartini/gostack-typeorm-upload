// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepo = getCustomRepository(TransactionsRepository);
    const categoryRepo = getRepository(Category);

    const { total } = await transactionRepo.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('You do not have enough balance');

    let transactionCategory = await categoryRepo.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepo.create({
        title: category,
      });

      await categoryRepo.save(transactionCategory);
    }

    const transaction = transactionRepo.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionRepo.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
