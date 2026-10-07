import type { Config } from 'jest';
import ts from 'typescript';

const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);

const paths = tsconfig?.compilerOptions?.paths ?? {};

const pathToRegex = (path: string) =>
  `^${path.replace('*', '(.*)')}$`;

const moduleNameMapper = Object.fromEntries(
  Object.entries(paths).map(([key, values]) => [
    pathToRegex(key),
    `<rootDir>/${values[0].replace('*', '$1')}`,
  ]),
);

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest'],
  },
  moduleNameMapper,
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;