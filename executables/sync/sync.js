const Rsync = require('rsync');

//az is rsync flag where z represents compression and a stands for "archive" and syncs recursively and
// preserves symbolic links, special and device files, modification times, group, owner, and permissions
const defaultFlag = 'az';

/**
 * @notice For remote Sync specify user,host and path in sourceConfig/destinationConfig, for local sync dont add user and host key
 *
 * @dev Key pair based ssh needs to setup for remote rsync
 *
 * @param sourceConfig object {user:'source_user', host:'10.1.2.2', path:'~/temp'}
 * @param destinationConfig object {user:'destination_user', host:'10.1.2.3', path:'~/temp'}
 *
 * @constructor
 *
 * Example:
 *
 * let sourceConfig = {
 *       user: "user",
 *       host: "10.1.1.1",
 *       path: "~/tmp"
 *     },
 * destinationConfig = {
 *       path: "~/tmp"
 *     },
 *  let syncInstance = new SyncKlass(sourceConfig, destinationConfig);
 *  syncInstance.perform( result =>{
 *     //Logic on success
 *  });
 *   //if source / destination is local then user or path key in config can be skipped
 */
function SyncKlass(sourceConfig, destinationConfig) {
  let oThis = this;

  oThis.source = oThis._formatPath(sourceConfig);
  oThis.destination = oThis._formatPath(destinationConfig);
}

SyncKlass.prototype = {
  /**
   * Sync source folder to destination folder
   *
   * @return {Promise<result>}
   */
  perform: function() {
    let oThis = this;

    return oThis._sync();
  },
  /**
   * Sync source folder to destination folder
   *
   * @return {Promise<result>}
   * @private
   */
  _sync: async function() {
    let oThis = this;

    oThis.rsync = new Rsync();
    oThis.rsync
      .flags(defaultFlag)
      .source(oThis.source)
      .destination(oThis.destination);

    return new Promise(function(resolve, reject) {
      oThis.rsync.execute(function(error, code, cmd) {
        if (error) {
          console.log(error);
          return reject(error);
        }
        resolve({
          statusCode: code,
          cmd: cmd
        });
      });
    });
  },

  /**
   * @param origin source/destination
   *
   * @return {string} formatted path of source/destination
   *
   * @private
   */
  _formatPath: function(origin) {
    let user = origin.user;
    let host = origin.host;
    let path = origin.path;
    if (!user || !host) {
      //return local directory path
      return path;
    }
    return path ? `${user}@${host}:${path}` : path;
  }
};

module.exports = SyncKlass;
