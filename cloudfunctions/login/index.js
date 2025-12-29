const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { username, password, role } = event
  
  try {
    // 查询用户
    const result = await db.collection('users')
      .where({
        username: username,
        password: password,
        role: role
      })
      .get()
    
    if (result.data.length > 0) {
      // 登录成功
      return {
        success: true,
        message: '登录成功',
        data: {
          id: result.data[0]._id,
          username: result.data[0].username,
          name: result.data[0].name,
          role: result.data[0].role
        }
      }
    } else {
      // 用户名或密码错误
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      message: '登录失败',
      error: err
    }
  }
}
