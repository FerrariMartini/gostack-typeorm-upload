import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, In, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepos from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactReadSetream = fs.createReadStream(filePath);
    const transactionRepo = getCustomRepository(TransactionsRepos);
    const categoriesRepo = getRepository(Category);

    const parses = csvParse({
      from_line: 2,
    });
    const parseCSV = contactReadSetream.pipe(parses);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !type || !value) return;
      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existCategories = await categoriesRepo.find({
      where: { title: In(categories) },
    });

    const existCategoriesTitle = existCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitle = categories
      .filter(category => !existCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepo.create(
      addCategoryTitle.map(title => ({
        title,
      })),
    );

    await categoriesRepo.save(newCategories);

    const finalCategories = [...newCategories, ...existCategories];

    const createdTransactions = transactionRepo.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepo.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}
export default ImportTransactionsService;
