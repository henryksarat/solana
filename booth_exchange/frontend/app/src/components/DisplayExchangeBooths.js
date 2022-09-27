import React from 'react';
import Table from 'react-bootstrap/Table';

class DisplayExchangeBooths extends React.Component {
    render() {
        if(this.props.exchange_booth_info.length == 0) {
          return ( 
            <label>
              No Exchange Booths Created Yet
          </label>
          )
        }
      
        var rows = []
    
        for(let i = 0; i < this.props.exchange_booth_info.length ; i++) {
          rows.push(
            <tr key={"exchange_booth_display_" + i}>
              <td>{this.props.exchange_booth_info[i].alias_mint_a}</td>
              <td>{this.props.exchange_booth_info[i].alias_mint_b}</td>
              <td>{parseFloat(this.props.exchange_booth_info[i].fee).toFixed(2)}</td>
              <td>{this.props.exchange_booth_info[i].rate}</td>
            </tr>
            )
        }
        
     return (
            <Table striped bordered hover size="sm">
            <thead>
                <tr>
                  <th>From Mint</th>
                  <th>To Mint</th>
                  <th>Fee</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
              
            </Table>
     );
   }
  }

  export default DisplayExchangeBooths;