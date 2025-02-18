import pg from 'pg';

type Row = Record<string, unknown>;
type QueryParams = Array<string | number | boolean | object>;

export class DB {
  private static _singleton: pg.Pool | undefined;
  private readonly pool: pg.Pool;

  constructor() {
    if (!DB._singleton) {
      DB._singleton = new pg.Pool({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env['PGPASSWORD'],
      });
    }

    this.pool = DB._singleton;
  }

  async query<T extends Row>(text: string, params?: QueryParams): Promise<pg.QueryResult<T>> {
    const result = await this.pool.query(text, params);
    return result;
  }
}
