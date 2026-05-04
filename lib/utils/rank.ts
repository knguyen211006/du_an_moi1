/**
 * Wuxia-themed Rank/Title System based on total points
 */

// Rank info interface
export interface RankInfo {
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  glow?: string;
}

// Get user rank based on total points
export function getUserRank(points: number): RankInfo {
  if (points <= 100) {
    return {
      title: "Tạp Dịch",
      subtitle: "Servant",
      color: "from-gray-400 to-gray-600",
      textColor: "text-gray-400",
      borderColor: "border-gray-400/30",
      bgColor: "bg-gray-400/10",
    };
  } else if (points <= 300) {
    return {
      title: "Ngoại Môn Đệ Tử",
      subtitle: "Outer Disciple",
      color: "from-green-400 to-green-600",
      textColor: "text-green-400",
      borderColor: "border-green-400/30",
      bgColor: "bg-green-400/10",
    };
  } else if (points <= 800) {
    return {
      title: "Nội Môn Đệ Tử",
      subtitle: "Inner Disciple",
      color: "from-blue-400 to-blue-600",
      textColor: "text-blue-400",
      borderColor: "border-blue-400/30",
      bgColor: "bg-blue-400/10",
    };
  } else if (points <= 1200) {
    return {
      title: "Chân Truyền",
      subtitle: "Core Disciple",
      color: "from-purple-400 to-purple-600",
      textColor: "text-purple-400",
      borderColor: "border-purple-400/30",
      bgColor: "bg-purple-400/10",
    };
  } else if (points <= 2000) {
    return {
      title: "Trưởng Lão",
      subtitle: "Elder",
      color: "from-orange-400 to-orange-600",
      textColor: "text-orange-400",
      borderColor: "border-orange-400/30",
      bgColor: "bg-orange-400/10",
    };
  } else {
    return {
      title: "Đại Tông Sư",
      subtitle: "Grandmaster",
      color: "from-yellow-400 to-yellow-600",
      textColor: "text-yellow-500",
      borderColor: "border-yellow-400/30",
      bgColor: "bg-yellow-400/10",
    };
  }
}