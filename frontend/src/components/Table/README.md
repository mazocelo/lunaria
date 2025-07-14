# DataTable

O componente `DataTable` é uma tabela genérica e altamente customizável para exibição de dados tabulares.

## Uso Básico

```jsx
import { DataTable } from './components/Table';

const columns = [
  { key: 'nome', label: 'Nome', render: row => <b>{row.nome}</b> },
  { key: 'idade', label: 'Idade' },
  { key: 'email', label: 'E-mail' },
];

const actions = [
  { label: 'Editar', icon: '✏️', onClick: row => alert(row.nome) },
  { label: 'Excluir', icon: '🗑️', onClick: row => alert(row.id) },
];

<DataTable
  data={dados}
  columns={columns}
  actions={actions}
  loading={false}
  title="Usuários"
  emptyMessage="Nenhum usuário encontrado"
  emptyIcon="👤"
/>
```

## Props

| Prop         | Tipo      | Descrição                                                                 |
|--------------|-----------|---------------------------------------------------------------------------|
| data         | array     | Array de objetos a serem exibidos na tabela                               |
| columns      | array     | Definição das colunas (ver abaixo)                                       |
| actions      | array     | (Opcional) Ações por linha (botões, menus, etc)                           |
| loading      | boolean   | (Opcional) Exibe spinner de carregamento                                 |
| title        | string    | (Opcional) Título da tabela                                               |
| emptyMessage | string    | (Opcional) Mensagem exibida quando não há dados                          |
| emptyIcon    | string    | (Opcional) Emoji ou ícone exibido quando não há dados                    |
| totalItems   | number    | (Opcional) Total de itens (para paginação, se implementado)               |
| className    | string    | (Opcional) Classes CSS adicionais                                         |

### Definição de columns

Cada coluna é um objeto com:
- `key`: string (campo do objeto)
- `label`: string (título da coluna)
- `render`: (opcional) função customizada para renderizar a célula
- `align`: (opcional) alinhamento ('left', 'center', 'right')

Exemplo:
```js
const columns = [
  { key: 'nome', label: 'Nome', render: row => <b>{row.nome}</b> },
  { key: 'idade', label: 'Idade', align: 'center' },
];
```

### Definição de actions

Cada ação é um objeto com:
- `label`: string
- `icon`: string (emoji ou ícone)
- `color`: string (opcional, cor do botão)
- `onClick`: função (recebe a linha como argumento)

Exemplo:
```js
const actions = [
  { label: 'Editar', icon: '✏️', onClick: row => alert(row.nome) },
  { label: 'Excluir', icon: '🗑️', onClick: row => alert(row.id) },
];
```

## Customização

- Use a prop `render` em columns para customizar a célula.
- Use `actions` para adicionar botões/menus por linha.
- Use `loading`, `emptyMessage` e `emptyIcon` para UX aprimorada.

## Exemplo Completo

```jsx
<DataTable
  data={produtos}
  columns={[
    { key: 'nome', label: 'Produto', render: row => <b>{row.nome}</b> },
    { key: 'preco', label: 'Preço', render: row => `R$ ${row.preco.toFixed(2)}` },
    { key: 'estoque', label: 'Estoque', align: 'center' },
  ]}
  actions={[
    { label: 'Editar', icon: '✏️', onClick: row => editarProduto(row) },
    { label: 'Excluir', icon: '🗑️', onClick: row => excluirProduto(row) },
  ]}
  loading={false}
  title="Produtos"
  emptyMessage="Nenhum produto cadastrado"
  emptyIcon="📦"
/>
```

---

> **Atenção:** Os componentes específicos de tabela (ex: RacaTable, VantagemTable, etc) foram descontinuados. Use apenas o `DataTable` genérico. 