/*
 * JavaScript client library for Ohmage 2.x.x
 * Autor: Kapeel Sable <kapeel.sable@gmail.com>
 * License: Apache 2.0
 */

import 'isomorphic-fetch';
import AppError from './AppError';

class Ohmage {
  constructor( server_url, client, auth_token, keycloak_token ) {
    this.server_url = server_url;
    this.client = client || 'ohmage.js';
    this.auth_token = auth_token || null;
    this.keycloak_token = keycloak_token || null;
    this.listener_onUnknownTokenError = ( ) => { };
    if( !this.server_url ) {
      throw new Error('Invalid constructor parameters.');
    }
  }

  __call( endpoint, data = { }, must_pass_token = true ) {
    let headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };
    if( !!this.keycloak_token ) {
      headers[ 'Authorization' ] = 'Bearer ' + this.keycloak_token;
    }
    else if( !!this.auth_token ) {
      data['auth_token'] = this.auth_token;
    }
    else if( must_pass_token ) {
      throw new Error( 'auth_token not set' );
    }

    data[ 'client' ] = this.client;

    var formBody = [];
    for (var key in data) {
      var encodedKey = encodeURIComponent(key);
      var encodedValue = encodeURIComponent(data[key]);
      formBody.push(encodedKey + '=' + encodedValue);
    }
    formBody = formBody.join('&');

    return fetch( this.server_url + endpoint, {
        method: 'post',
        headers: headers,
        body: formBody
      } )
      .then( response => {
        if( response.status === 200 ) {
          return response.json( )
              .then( body => {
                if( body.result === 'success' ) {
                  return !!body.data ? body.data : body;
                }
                else {
                  if( body.errors.length > 0 ) {
                    if( body.errors[ 0 ].code === '0200' ) {
                      this.listener_onUnknownTokenError( body.errors[ 0 ] );
                    }
                  }
                  throw new AppError( 'ohmage', 'API response failed.', { body } );
                }
              } );
        }
        else {
          throw new AppError( 'https', 'HTTPS error occurred.', response );
        }
      } )
      .catch( exception => {
        throw new AppError( 'ohmage_api', 'API call failed', null, exception );
      } );
  }

  _setToken( auth_token ) {
    this.auth_token = auth_token;
  }

  _getToken( ) {
    return this.auth_token;
  }

  _onUnknownTokenError( fn ) {
    this.listener_onUnknownTokenError = fn;
  }

  authToken( username, password ) {
    return this.__call( '/user/auth_token', { user: username, password }, false )
  }

  changePassword( username, old_password, new_password ) {
    return this.__call( '/user/change_password', { user: username, password: old_password, new_password }, false )
  }

  whoAmI( ) {
    return this.__call( '/user/whoami' );
  }

  readConfig( ) {
    return this.__call( '/config/read', undefined, false );
  }

  getLogs( parameters ) {
    return this.__call( '/audit/read', parameters );
  }

  userCreate( parameters ) {
    return this.__call( '/user/create', parameters );
  }

  userSetup( parameters ) {
    return this.__call( '/user/setup', parameters );
  }

  userUpdate( parameters ) {
    return this.__call( '/user/update', parameters );
  }

  userRead( users ) {
    return this.__call( '/user/read', { user_list: users.join( ',' ) } );
  }

  classCreate( class_urn, class_name, description = '' ) {
    return this.__call( '/class/create', { class_urn, class_name, description } );
  }

  classUpdate( class_urn, parameters = { } ) {
    parameters.class_urn = class_urn;
    return this.__call( '/class/update', parameters );
  }

}

export default Ohmage;
