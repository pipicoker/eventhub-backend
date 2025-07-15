const User = require('../models/usermodel');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.updateUser = async (req, res) => {
  try {
    console.log('Updating user avatar...');
    const { id } = req.params;
    console.log('User ID:', id);
    let avatarUrl = req.body.avatar;

    if (req.file) {
      console.log('File uploaded locally:', req.file.path);
      console.log('req.file', req.file);


      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'avatars',
        public_id: `${id}_avatar`,
        overwrite: true,
      });

      console.log('Cloudinary upload successful:', uploadResult.secure_url);

      avatarUrl = uploadResult.secure_url;

      // Delete temp file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }

    if (!avatarUrl) {
      const user = await User.findById(id);
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    }

    const updatedUser = await User.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true });
    console.log('User updated successfully');

    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error('Error updating user avatar:', err);
    console.error(err.stack); 
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
};

