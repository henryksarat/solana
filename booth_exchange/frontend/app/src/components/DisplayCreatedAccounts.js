import React from 'react';
import DisplayCreatedAccountsDisplay from './DisplayCreatedAccountsDisplay';

class DisplayCreatedAccounts extends React.Component {
    render() {    
        const parent = new Map()
        Array.from(this.props.accounts.entries()).map((entry) => {
            const [key, value] = entry;
            var child = new Map()
            Array.from(value.mints.entries()).map((mint_entry) => {
                const [mint_key, mint_value] = mint_entry;
                child.set(mint_key, {
                    'alias': mint_value.alias,
                    'amount': mint_value.amount
                })
            })
            
            parent.set(key, {
                'account_public_key': this.props.accounts.get(key).account.publicKey.toBase58(),
                'mints': child
            })
        })
     return (
            <DisplayCreatedAccountsDisplay accounts={parent}>
            </DisplayCreatedAccountsDisplay>
     );
   }
  }
  
export default DisplayCreatedAccounts;