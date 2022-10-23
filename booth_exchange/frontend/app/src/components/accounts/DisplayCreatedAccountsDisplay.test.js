import { render, screen } from '@testing-library/react';
import DisplayCreatedAccountsDisplay from './DisplayCreatedAccountsDisplay';


test('renders Created Accounts Table with one element', () => {
  const parent = new Map()

  var child = new Map()

  child.set('mint_a', {
    'alias': 'alias_1',
    'amount': '100',
  })

  parent.set('account_one', {
    'account_public_key': 'pub_key_1',
    'mints': child
  })

  render(<DisplayCreatedAccountsDisplay accounts={parent} />);

  var expected = [
    [/pub_key_1/i, 1],
    [/alias_1/i, 1],
    [/100/i, 1]
  ]

  var assertsPassed = 0

  Array.from(expected).map(result => {
    var element = screen.getAllByText(result[0])
    expect(element).toHaveLength(result[1])
    assertsPassed++
  })

  expect(assertsPassed).toBe(expected.length)
});

test('renders Created Accounts Table with two or more elements', () => {
  const parent = new Map()

  var child = new Map()

  child.set('mint_a', {
    'alias': 'alias_1',
    'amount': '100',
  })

  child.set('mint_b', {
    'alias': 'alias_2',
    'amount': '200',
  })

  parent.set('account_one', {
    'account_public_key': 'pub_key_1',
    'mints': child
  })

  var childTwo = new Map()

  childTwo.set('mint_a', {
    'alias': 'alias_2',
    'amount': '400',
  })

  childTwo.set('mint_b', {
    'alias': 'alias_3',
    'amount': '100',
  })

  parent.set('account_two', {
    'account_public_key': 'pub_key_2',
    'mints': childTwo
  })

  render(<DisplayCreatedAccountsDisplay accounts={parent} />);

  var expected = [
    [/pub_key_1/i, 2],
    [/alias_1/i, 1],
    [/alias_2/i, 2],
    [/alias_3/i, 1],
    [/100/i, 2],
    [/400/i, 1],
    [/200/i, 1],
  ]

  var assertsPassed = 0

  Array.from(expected).map(result => {
    var element = screen.getAllByText(result[0])
    expect(element).toHaveLength(result[1])
    assertsPassed++
  })

  expect(assertsPassed).toBe(expected.length)
});

test('renders Created Accounts Table with no elements', () => {
  const parent = new Map()

  render(<DisplayCreatedAccountsDisplay accounts={parent} />);

  
  const pubKeyElement = screen.getByText(/No accounts created yet/i);
  expect(pubKeyElement).toBeInTheDocument();

});
