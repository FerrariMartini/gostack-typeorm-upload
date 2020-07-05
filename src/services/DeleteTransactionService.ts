import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: number): Promise<void> {
    const transactionsRepo = getCustomRepository(TransactionRepository);

    const transaction = await transactionsRepo.findOne(id);

    if (!transaction) throw new AppError('Transaction not found');

    await transactionsRepo.remove(transaction);
  }
}

export default DeleteTransactionService;
