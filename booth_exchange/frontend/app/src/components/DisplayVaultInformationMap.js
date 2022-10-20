import {threeDotStringRepresentation} from '../helpers/stringUtil'
import ShorthandWithToolTip from './ShorthandWithToolTip'
import Table from 'react-bootstrap/Table';
import React from 'react';

class DisplayVaultInformationMap extends React.Component {
    render() {    
        if(this.props.vault_info.size == 0) {
          return ( 
            <label>
              No vaults created yet
          </label>
          )
        }
        
        var rows = []
        {
          [...this.props.vault_info.keys()].map(k => (
              rows.push(
              <tr key={k}>
                <td>{this.props.alias_loopup(this.props.vault_info.get(k).mint.toBase58())}</td>
                <td>
                  <ShorthandWithToolTip 
                      renderTooltip={this.props.renderTooltip} 
                      short_version={threeDotStringRepresentation(this.props.vault_info.get(k).mint.toBase58())} 
                      long_version={this.props.vault_info.get(k).mint.toBase58()}>
                  </ShorthandWithToolTip>
                </td>
                <td>    
                  <ShorthandWithToolTip 
                    renderTooltip={this.props.renderTooltip} 
                    short_version={threeDotStringRepresentation(this.props.vault_info.get(k).ata.address.toBase58())} 
                    long_version={this.props.vault_info.get(k).ata.address.toBase58()}>
                  </ShorthandWithToolTip>
              </td>
                <td>{this.props.vault_info.get(k).current_amount}</td>
                <td>{this.props.vault_info.get(k).deposit_amount_in_booth}</td>
                <td>{
                  this.props.vault_info.get(k).pda == "NA" ? 
                    "NA" : 
                    <ShorthandWithToolTip 
                      renderTooltip={this.props.renderTooltip} 
                      short_version={threeDotStringRepresentation(this.props.vault_info.get(k).pda.toBase58())} 
                      long_version={this.props.vault_info.get(k).pda.toBase58()}>
                    </ShorthandWithToolTip>
                  }</td>
              </tr>
              )
          ))
        }
        
     return (
            <Table striped bordered hover size="sm">
            <thead>
                <tr>
                  <th>Alias</th>
                  <th>Mint</th>
                  <th>ATA</th>
                  <th>Current Amount</th>
                  <th>Deposit Amount in Exchange Booth</th>
                  <th>PDA</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
              
            </Table>
     );
   }
  }

  export default DisplayVaultInformationMap;