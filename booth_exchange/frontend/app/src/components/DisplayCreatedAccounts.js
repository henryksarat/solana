import React from 'react';
import Table from 'react-bootstrap/Table';

class DisplayCreatedAccounts extends React.Component {
    render() {    
        if(this.props.accounts.size == 0) {
          return ( 
            <label>
              No accounts created yet
          </label>
          )
        }
        
        var rows = []
        {
          [...this.props.accounts.keys()].map(k => (
            [...this.props.accounts.get(k).mints.keys()].map(v => (
              rows.push(
              <tr key={k + v}>
                <td>{this.props.accounts.get(k).account.publicKey.toBase58()}</td>
                <td>{this.props.accounts.get(k).mints.get(v).alias}</td>
                <td>{this.props.accounts.get(k).mints.get(v).amount}</td>
              </tr>
              )
  
  
            ))
          ))
        }
     return (
            <Table striped bordered hover size="sm">
            <thead>
                <tr>
                  <th>Account</th>
                  <th>Mint</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
              
            </Table>
     );
   }
  }

  export default DisplayCreatedAccounts;