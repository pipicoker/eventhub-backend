const User = require('../models/usermodel');
const cloudinary = require('../config/cloudinary');

exports.updateUser = async (req, res) => {
  try {
    console.log('Updating user avatar...');
    const { id } = req.params;
    let avatarUrl = req.body.avatar;

    if (req.file) {
      console.log('In-memory file:', req.file);

      // Convert file buffer to Base64 string
      const base64Image = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'avatars',
        public_id: `${id}_avatar`,
        overwrite: true,
      });

      console.log('✅ Cloudinary upload successful:', uploadResult.secure_url);

      avatarUrl = uploadResult.secure_url;
    }

    if (!avatarUrl) {
      const user = await User.findById(id);
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    }

    const updatedUser = await User.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true });
    console.log('✅ User updated successfully');

    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error('❌ Error updating user avatar:', err);
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
};
