import { render, screen } from '@testing-library/react';
import DisplayMintInformation from './DisplayMintInformation';
import {renderTooltip} from '../../helpers/uiHelperUtil'

test('renders Created Mints Table with one element', () => {
  const parent =[]

  parent.push({
    'alias': "some_alias_1",
    'mint_base58': 'mint_1',
    'admin_public_key_base58': 'key_1',
    'admin_token_account_address_address_base58': 'admin_1',
    'amount_minted': '11111',
    'current_amount_in_origin_admin_ata': '222222'
  })

  render(<DisplayMintInformation 
    mint_info={parent} 
    renderTooltip={(props, text)=>renderTooltip(props, text)}
  />);

  var expected = [
    [/some_alias_1/i, 1],
    [/mint_1/i, 1],
    [/key_1/i, 1],
    [/admin_1/i, 1],
    [/11111/i, 1],
    [/222222/i, 1],
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
  const parent = []

  render(<DisplayMintInformation mint_info={parent} />);

  
  const pubKeyElement = screen.getByText(/No mint created yet/i);
  expect(pubKeyElement).toBeInTheDocument();
});
