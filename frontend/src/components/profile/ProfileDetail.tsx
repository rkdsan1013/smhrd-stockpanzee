// /frontend/src/components/profile/ProfileDetail.tsx
import React from "react";
import type { UserProfile } from "../../services/userService";

interface Props {
  profile: UserProfile;
}

const ProfileDetail: React.FC<Props> = ({ profile }) => (
  <div className="max-w-2xl ml-auto">
    <div className="grid grid-cols-4 items-center gap-4">
      <div className="col-span-1 text-right text-gray-300">이름</div>
      <div className="col-span-3 text-white">{profile.username}</div>
      <div className="col-span-1 text-right text-gray-300">이메일 주소</div>
      <div className="col-span-3 text-white">
        {profile.email ? profile.email : <span className="text-gray-500">이메일 정보 없음</span>}
      </div>
    </div>
  </div>
);

export default ProfileDetail;
