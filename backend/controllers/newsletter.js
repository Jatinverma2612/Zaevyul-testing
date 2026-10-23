import Newsletter from '../model/Newsletter.js';

export const getSubscribers = async (req, res) => {
  const { search } = req.query;
  try {
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 });
    return res.status(200).json({ success: true, subscribers });
  } catch (error) {
    console.error('Fetch newsletter subscribers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteSubscriber = async (req, res) => {
  try {
    const sub = await Newsletter.findByIdAndDelete(req.params.id);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }
    return res.status(200).json({ success: true, message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const bulkDeleteSubscribers = async (req, res) => {
  const { ids } = req.body;
  try {
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'IDs array is required' });
    }
    await Newsletter.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({ success: true, message: 'Selected subscribers deleted successfully' });
  } catch (error) {
    console.error('Bulk delete subscribers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
