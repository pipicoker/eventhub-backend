const User = require('../models/usermodel');


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    let avatarUrl = req.body.avatar;


    // If a file was uploaded, use its path
    if (req.file) {
      console.log("File uploaded:", req.file);
      avatarUrl = `${process.env.BACKEND_BASE_URL}/uploads/${req.file.filename}`;
    }

    // Use Dicebear if no avatar provided
    if (!avatarUrl) {
      const user = await User.findById(id);
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    }

    const updatedUser = await User.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true });

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.log(err);
    
    res.status(500).json({ error: 'Failed to update avatar' });
  }
};
