import React from 'react';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import Table from 'react-bootstrap/Table';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import {threeDotStringRepresentation} from '../helpers/stringUtil'
import ShorthandWithToolTip from './ShorthandWithToolTip'

class DisplayMintInformation extends React.Component {
    render() {
        if(this.props.mint_info.length == 0) {
          return ( 
            <label>
              No mint created yet 
          </label>
          )
        }
      
        var rows = []
    
        var total_amount = 0
        for(let i = 0; i < this.props.mint_info.length ; i++) {
          rows.push(
            <tr key={i}>
              <td>{this.props.mint_info[i].alias}</td>
              <td>    
                  <ShorthandWithToolTip 
                    renderTooltip={this.props.renderTooltip} 
                    short_version={threeDotStringRepresentation(this.props.mint_info[i].mint_base58)} 
                    long_version={this.props.mint_info[i].mint.toBase58()}>
                  </ShorthandWithToolTip>
              </td>
              <td>    
                  <ShorthandWithToolTip 
                    renderTooltip={this.props.renderTooltip} 
                    short_version={threeDotStringRepresentation(this.props.mint_info[i].admin_public_key_base58)} 
                    long_version={this.props.mint_info[i].admin_public_key_base58}>
                  </ShorthandWithToolTip>
              </td>
              <td>    
                  <ShorthandWithToolTip 
                    renderTooltip={this.props.renderTooltip} 
                    short_version={threeDotStringRepresentation(this.props.mint_info[i].admin_token_account_address_address_base58)} 
                    long_version={this.props.mint_info[i].admin_token_account_address_address_base58}>
                  </ShorthandWithToolTip>
              </td>
       
              <td>{this.props.mint_info[i].amount_minted}</td>
              <td>{this.props.mint_info[i].current_amount_in_origin_admin_ata}</td>
            </tr>
            )
        }
        
  
     return (
            <Table striped bordered hover size="sm">
            <thead>
                <tr>
                  <th>Alias</th>
                  <th>Mint</th>
                  <th>Admin Public Key</th>
                  <th>ATA</th>
                  <th>Minted Amount</th>
                  <th>Remaining Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
              
            </Table>
     );
   }
  }

  export default DisplayMintInformation;